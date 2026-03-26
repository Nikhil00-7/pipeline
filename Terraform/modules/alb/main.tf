

resource "kubernetes_service_account_v1" "alb_service_account" {
   metadata {
    name      = "aws-load-balancer-controller"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = var.alb_role_arn
    }
  }
}

resource "helm_release" "aws_lb_controller" {

  depends_on = [ kubernetes_service_account_v1.alb_service_account ]

  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  set = [
    {
      name  = "clusterName"
      value = var.eks_cluster_name
    },
    {
      name  = "region"
      value = var.aws_region
    },
  
    {
      name  = "serviceAccount.create"
      value = "false"  
    }
  ]
}






resource "kubernetes_service_account_v1" "external_dns_service_account" {
  metadata {
    name= "aws-external-dns-controller"
    namespace = "kube-sytem"
  
    annotations = {
      "eks.amazonaws.com/role-arn" = var.external_dns_role_arn
    }
  }
}


resource "helm_release" "external_dns" {

   depends_on = [kubernetes_service_account_v1.external_dns_service_account]

  name       = "external-dns"
  repository = "https://kubernetes-sigs.github.io/external-dns/"
  chart      = "external-dns"

  namespace  = "kube-system"

  set = [
    {
      name  = "provider"
      value = "aws"
    },

    {
      name  = "serviceAccount.create"
      value = "false"
    },

    {
      name  = "serviceAccount.name"
      value = "external-dns"
    },

    {
      name  = "domainFilters[0]"
      value = "example.com"
    }
  ]
}