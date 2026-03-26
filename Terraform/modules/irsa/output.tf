output "lb_role_arn" {
 value = aws_iam_role.alb_controller_role.arn 
}

output "external_dns_role_arn" {
  value = aws_iam_role.external_dns_role.arn
}

