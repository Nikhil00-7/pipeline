
output "eks_cluster_role_arn" {
  description = "ARN of the EKS Cluster IAM Role"
  value       = aws_iam_role.cluster_role.arn
}

output "eks_cluster_role_name" {
  description = "Name of the EKS Cluster IAM Role"
  value       = aws_iam_role.cluster_role.name
}


output "eks_node_role_arn" {
  description = "ARN of the EKS NodeGroup IAM Role"
  value       = aws_iam_role.eks_node_role.arn
}

output "eks_node_role_name" {
  description = "Name of the EKS NodeGroup IAM Role"
  value       = aws_iam_role.eks_node_role.name
}


output "eks_node_attached_policies" {
  description = "List of policies attached to EKS Node Role"
  value = [
    aws_iam_role_policy_attachment.worker_node_policy.policy_arn,
    aws_iam_role_policy_attachment.cni_policy.policy_arn,
    aws_iam_role_policy_attachment.ecr_readOnly.policy_arn,
    aws_iam_role_policy_attachment.lb_controller_node_policy.policy_arn
  ]
}

output "eks_cluster_attached_policy" {
  description = "Policy attached to EKS Cluster Role"
  value       = aws_iam_role_policy_attachment.cluster_role_attachment.policy_arn
}

output "velero_role_arn" {
  value = aws_iam_role.velero_role.arn
}